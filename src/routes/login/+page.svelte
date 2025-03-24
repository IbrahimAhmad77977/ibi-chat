<script lang="ts">
    import { superForm } from 'sveltekit-superforms';
    export let data;
    const { form, errors, constraints, message, enhance } = superForm(data.form, {
        taintedMessage: 'Are you sure you want to leave?'
    });
    import SuperDebug from 'sveltekit-superforms';
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-6">
    <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        {#if $message}
            <h3 class="mb-4 text-center text-lg font-semibold text-red-500">{$message}</h3>
        {/if}

        <SuperDebug data={$form} />

        <h1 class="mb-6 text-center text-3xl font-bold text-gray-800">New Contact</h1>

        <form method="POST" use:enhance class="space-y-5">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    bind:value={$form.email}
                    {...$constraints.email}
                    aria-invalid={$errors.email ? 'true' : undefined}
                    class="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                {#if $errors.email}
                    <p class="mt-1 text-sm text-red-500">{$errors.email}</p>
                {/if}
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    bind:value={$form.password}
                    {...$constraints.password}
                    aria-invalid={$errors.password ? 'true' : undefined}
                    class="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                {#if $errors.password}
                    <p class="mt-1 text-sm text-red-500">{$errors.password}</p>
                {/if}
            </div>

            <div class="flex justify-center">
                <button
                    type="submit"
                    class="w-full rounded-lg bg-blue-500 px-6 py-3 text-lg font-semibold text-white transition duration-200 hover:bg-blue-600"
                >
                    Submit
                </button>
            </div>
        </form>
    </div>
</div>
